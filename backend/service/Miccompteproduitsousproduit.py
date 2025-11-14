from flask import Blueprint, request, jsonify
import pyodbc
import datetime
from datetime import datetime
from typing import List
import json
import requests
import socket
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
#import pyodbc
import sys
sys.path.append("../")
from config import MYSQL_REPONSE,LIENAPISMS
import threading



def List_compte_produit(connection, NC_CODENATURECOMPTE, PS_ACTIF, TYPEECRAN):
    """
    Récupère les données de la procédure SQL [PS_LISTEPRODUIT].
    
    :param connection: Connexion à la base de données SQL Server
    :param NC_CODENATURECOMPTE: Nature du compte (varchar)
    :param PS_ACTIF: Indicateur actif (varchar)
    :param TYPEECRAN: Type d'écran (varchar)
    :return: Liste de dictionnaires représentant les enregistrements de la table
    """
    try:
        cursor = connection.cursor()
        
        # Remplacer les doubles quotes par des simples quotes dans NC_CODENATURECOMPTE
        NC_CODENATURECOMPTE = NC_CODENATURECOMPTE.replace("''", "'")
        
        # Exécuter la procédure stockée avec le bon schéma (assure-toi que 'dbo' est le bon schéma)
        cursor.execute("EXEC dbo.PS_LISTEPRODUIT ?, ?, ?", NC_CODENATURECOMPTE, PS_ACTIF, TYPEECRAN)
        
        # Passer aux résultats (au cas où la procédure exécute plusieurs commandes)
        cursor.nextset()
        # Récupérer les résultats
        rows = cursor.fetchall()
        results = []
        
        # Parcourir les lignes et les convertir en dictionnaires
        for row in rows:
            result = {
                'PL_CODENUMCOMPTE': row.PL_CODENUMCOMPTE,
                'PS_CODESOUSPRODUIT': row.PS_CODESOUSPRODUIT,
                'PS_ABREVIATION': row.PS_ABREVIATION,
                'PS_LIBELLE': row.PS_LIBELLE,
                'PS_DUREEMINIMUM': row.PS_DUREEMINIMUM,
                'PS_DUREEMAXIMUM': row.PS_DUREEMAXIMUM,
                'PS_CREATIONAUTOMATIQUEORDREVIREMENT': row.PS_CREATIONAUTOMATIQUEORDREVIREMENT,
                'PS_FRAISOUVERTURECREATIONCOMPTE': row.PS_FRAISOUVERTURECREATIONCOMPTE,
                'PL_NUMCOMPTE': row.PL_NUMCOMPTE,
                'COCHER': row.COCHER
            }
            results.append(result)
        
        return results
    
    except Exception as e:
        # Gérer les exceptions et retourner un message d'erreur approprié
        raise Exception(f"Erreur lors de la récupération des données: {str(e)}")
