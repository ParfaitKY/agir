from flask import Blueprint,request, jsonify,current_app
from service.Miccompteproduitsousproduit import List_compte_produit
from models.models import clsObjetEnvoi
from utils import connect_database
from datetime import datetime
from config import MYSQL_REPONSE
import random
import string
api_bp = Blueprint('api', __name__)


################################################################
#                  GESTION COMPTE PRODUIT                      #
################################################################

@api_bp.route('/pvgChargerDansDataSetListeProduit', methods=['POST'])
def ChargerDansDataSetListeProduit():
    request_data = request.json
    
    if 'Objet' not in request_data:
        return jsonify({"SL_MESSAGE": "Données manquantes.code erreur (300) voir le noeud Objet", "SL_RESULTAT": 'FALSE'})

    for row in request_data['Objet']:
        user_info = {}

        # Validation et récupération des données pour la suppression
        user_info['NC_CODENATURECOMPTE'] = row.get('NC_CODENATURECOMPTE')
        user_info['PS_ACTIF'] = row.get('PS_ACTIF')
        user_info['TYPEECRAN'] = row.get('TYPEECRAN')

        # Vérification que toutes les données obligatoires sont présentes
        if not all([user_info['NC_CODENATURECOMPTE'], user_info['PS_ACTIF'], user_info['TYPEECRAN']]):
            return jsonify({"SL_MESSAGE": "Données manquantes ou incorrectes.code erreur (301)", "SL_RESULTAT": 'FALSE'})

        # Connexion à la base de données
        db_connection = connect_database()

        try:
            with db_connection.cursor() as cursor:
                cursor.execute("BEGIN TRANSACTION")
                
                # Appeler la fonction de suppression ou récupération
                response = List_compte_produit(db_connection,str(row.get('NC_CODENATURECOMPTE', '')),str(row.get('PS_ACTIF', '')),str(row.get('TYPEECRAN', '')))
                
                if response and response[0].get('PS_CODESOUSPRODUIT'):
                    return jsonify({"SL_MESSAGE": "Opération effectuée avec succès !!!", "SL_RESULTAT": 'TRUE'}, response)
                else:
                    cursor.execute("ROLLBACK")
                    return jsonify({"SL_MESSAGE": "Utilisateur non trouvé ou autre erreur.", "SL_RESULTAT": 'FALSE'})
        
        except Exception as e:
            db_connection.rollback()
            return jsonify({"SL_MESSAGE": "Erreur lors de la suppression : " + str(e), "SL_RESULTAT": 'FALSE'})
        
        finally:
            db_connection.close()



################################################################
#                  FIN GESTION COMPTE PRODUIT                  #
################################################################



# Fonction pour générer un code aléatoire
def generer_code_aleatoire(taille=6):
    lettres_chiffres = string.ascii_uppercase + string.digits
    return ''.join(random.choice(lettres_chiffres) for _ in range(taille))               

def parse_numeric(value):
    """Vérifie si la valeur est un nombre et la convertit. Renvoie une exception si la conversion échoue."""
    if value is None or value == '':
        return None
    try:
        return int(value)
    except ValueError:
        raise ValueError(f"Format numérique invalide: {value}")


def parse_datetime(date_str):
    """Convertit une chaîne de caractères en datetime. Renvoie None si la conversion échoue."""
    if not date_str:
        return None
    
    # Liste des formats possibles
    date_formats = ["%d/%m/%Y","%d-%m-%Y", "%Y-%m-%d %H:%M:%S"]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # Si aucun format ne correspond, lever une exception
    raise ValueError(f"Format de date invalide: {date_str}")

def get_commit(connection,clsBilletages):
    try:
       for row in clsBilletages: 
        cursor = connection
        params = {
            'AG_CODEAGENCE3': '1000',
            'MC_DATEPIECE3': '01/01/1900'
        }
        try:
            connection.commit()
            cursor.execute("EXECUTE [PC_COMMIT]  ?, ?", list(params.values()))
            #instruction pour valider la commande de mise à jour
            connection.commit()
        except Exception as e:
            # En cas d'erreur, annuler la transaction
            cursor.execute("ROLLBACK")
            cursor.close()
            MYSQL_REPONSE = e.args[1]
            if "varchar" in MYSQL_REPONSE:
               MYSQL_REPONSE = MYSQL_REPONSE.split("varchar", 1)[1].split("en type de donn", 1)[0]
               
            raise Exception(MYSQL_REPONSE)
    except Exception as e:
        MYSQL_REPONSE = f'Erreur lors du commit des opérations: {str(e)}'
        raise Exception(MYSQL_REPONSE)  